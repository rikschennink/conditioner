<nav class="sub code">
    <ul>
        {% for item in objects %}
        <li>
            <a href="#{{ item.name | id }}">{{ item.name }}</a>
        </li>
        {% endfor %}
    </ul>
</nav>

{% for item in objects %}
<section>
    <h3 id="{{ item.name | id }}">{{ item.name }}</h3>

    {{ item.description | markdown }}

    {% if item.events %}
    <table class="events">
        <thead>
        <tr>
            <th>Event</th>
            <th>Description</th>
        </tr>
        </thead>
        <tbody>
        {% for event in item.events %}
        <tr>
            <th>{{ event.name }}</th>
            <td>{{ event.description | markdown }}</td>
        </tr>
        {% endfor %}
        </tbody>
    </table>
    {% endif %}

    {% if item.methods %}
    <nav class="sub code">
        <ul>
            {% for method in item.methods %}
            <li><a href="#{{item.name | id }}-{{method.name | id }}">{{ method.name }}</a>{{ method.returns | returns }}</li>
            {% endfor %}
        </ul>
    </nav>
    {% endif %}

    {% for method in item.methods %}
    <section class="method">

        <h4 id="{{item.name | id }}-{{method.name | id }}">{{ method.name }}({{ method.params | params }}){% if method.returns %}<span class="code">{{ method.returns | returns }}</span>{% endif %}</h4>

        {% if method.params %}
        <table class="params">
            <thead>
            <tr>
                <th>Parameter</th>
                <th>Type</th>
                <th>Description</th>
            </tr>
            </thead>
            <tbody>
            {% for param in method.params %}
            <tr>
                <th>{{ param.name }}</th>
                <td>{{ param.type }}</td>
                <td>{{ param.description | markdown }}</td>
            </tr>
            {% endfor %}
            </tbody>
        </table>
        {% endif %}

        {{ method.description | markdown }}

    </section>
    {% endfor %}

</section>
{% endfor %}